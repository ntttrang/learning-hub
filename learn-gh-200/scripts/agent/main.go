// Command agent reviews a pull request diff with an LLM and posts the result
// as a PR comment. It runs inside the agent-reviewer GitHub Actions workflow;
// see .github/workflows/agent-reviewer.yml for the required environment.
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/go-github/v60/github"
	"golang.org/x/oauth2"
)

const (
	// geminiEndpoint is the REST base for generateContent calls.
	geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/"
	// defaultGeminiModel is used when GEMINI_MODEL is not set.
	defaultGeminiModel = "gemini-2.5-flash"
	// maxPayloadBytes caps diffs and API error bodies sent to the LLM or logs.
	maxPayloadBytes = 100_000
)

// config gathers everything the agent needs from the workflow environment.
type config struct {
	githubToken string
	geminiKey   string
	geminiModel string
	prNumber    int
	owner       string
	repo        string
}

func main() {
	if err := run(); err != nil {
		log.Fatalf("agent: %v", err)
	}
}

func run() error {
	cfg, err := loadConfig()
	if err != nil {
		return err
	}
	ctx := context.Background()

	// GitHub client: token auth with a bounded timeout per API call.
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: cfg.githubToken})
	tc := oauth2.NewClient(ctx, ts)
	tc.Timeout = 30 * time.Second
	client := github.NewClient(tc)

	diff, _, err := client.PullRequests.GetRaw(ctx, cfg.owner, cfg.repo, cfg.prNumber, github.RawOptions{Type: github.Diff})
	if err != nil {
		return fmt.Errorf("fetch PR diff: %w", err)
	}
	if strings.TrimSpace(diff) == "" {
		log.Println("PR has no changes; nothing to review")
		return nil
	}

	review, err := analyzeCodeWithLLM(ctx, cfg, diff)
	if err != nil {
		return err
	}

	comment := fmt.Sprintf("🤖 **AI Reviewer Agent** (%s)\n\n%s", cfg.geminiModel, review)
	if _, _, err := client.Issues.CreateComment(ctx, cfg.owner, cfg.repo, cfg.prNumber, &github.IssueComment{Body: github.String(comment)}); err != nil {
		return fmt.Errorf("post review comment: %w", err)
	}
	log.Printf("Posted review comment to %s/%s#%d", cfg.owner, cfg.repo, cfg.prNumber)
	return nil
}

// loadConfig reads and validates the environment provided by the workflow.
func loadConfig() (config, error) {
	var missing []string
	need := func(name string) string {
		v := os.Getenv(name)
		if v == "" {
			missing = append(missing, name)
		}
		return v
	}

	cfg := config{
		githubToken: need("GITHUB_TOKEN"),
		geminiKey:   need("GEMINI_API_KEY"),
		geminiModel: os.Getenv("GEMINI_MODEL"),
	}
	if cfg.geminiModel == "" {
		cfg.geminiModel = defaultGeminiModel
	}

	prNumber, err := strconv.Atoi(need("PR_NUMBER"))
	if err != nil {
		return config{}, fmt.Errorf("invalid PR_NUMBER %q: %w", os.Getenv("PR_NUMBER"), err)
	}
	cfg.prNumber = prNumber

	owner, name, err := parseRepository(need("REPOSITORY"))
	if err != nil {
		return config{}, err
	}
	cfg.owner, cfg.repo = owner, name

	if len(missing) > 0 {
		return config{}, fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}
	return cfg, nil
}

// parseRepository splits an "owner/repo" string into its two parts.
func parseRepository(repository string) (owner, name string, err error) {
	owner, name, ok := strings.Cut(repository, "/")
	if !ok || owner == "" || name == "" || strings.Contains(name, "/") {
		return "", "", fmt.Errorf("invalid REPOSITORY %q, want owner/repo", repository)
	}
	return owner, name, nil
}

// analyzeCodeWithLLM sends the diff to Gemini and returns its markdown review.
func analyzeCodeWithLLM(ctx context.Context, cfg config, diff string) (string, error) {
	reqBody, err := json.Marshal(geminiRequest{
		Contents: []geminiContent{{
			Parts: []geminiPart{{Text: reviewPrompt + truncatePayload(diff)}},
		}},
	})
	if err != nil {
		return "", fmt.Errorf("build gemini request: %w", err)
	}

	url := geminiEndpoint + cfg.geminiModel + ":generateContent"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(reqBody))
	if err != nil {
		return "", fmt.Errorf("build gemini request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", cfg.geminiKey)

	httpClient := &http.Client{Timeout: 120 * time.Second}
	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("call gemini API: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(io.LimitReader(resp.Body, maxPayloadBytes))
	if err != nil {
		return "", fmt.Errorf("read gemini response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini API status %d: %s", resp.StatusCode, truncatePayload(string(data)))
	}

	var out geminiResponse
	if err := json.Unmarshal(data, &out); err != nil {
		return "", fmt.Errorf("decode gemini response: %w", err)
	}
	if len(out.Candidates) == 0 || len(out.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini API returned no candidates: %s", truncatePayload(string(data)))
	}
	return out.Candidates[0].Content.Parts[0].Text, nil
}

// truncatePayload bounds large diffs and error bodies sent to the LLM or logs.
func truncatePayload(s string) string {
	if len(s) <= maxPayloadBytes {
		return s
	}
	return s[:maxPayloadBytes] + "\n... (truncated)"
}

// reviewPrompt steers the LLM toward a concise, actionable PR review.
const reviewPrompt = `You are a senior code reviewer. Review the pull request diff below.
Focus on correctness bugs, security issues, performance problems, and missing tests.
Respond in GitHub-flavored markdown with concise bullet points, most important findings first.
If the change is clean, say so in one line and stop.

Diff:
`

// Gemini REST request/response shapes (only the fields we use).

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text,omitempty"`
}

type geminiResponse struct {
	Candidates []struct {
		Content geminiContent `json:"content"`
	} `json:"candidates"`
}
