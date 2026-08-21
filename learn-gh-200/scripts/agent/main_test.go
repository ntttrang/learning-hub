package main

import (
	"strings"
	"testing"
)

func TestParseRepository(t *testing.T) {
	tests := []struct {
		in    string
		owner string
		name  string
		ok    bool
	}{
		{in: "ntttrang/learn-gh-200", owner: "ntttrang", name: "learn-gh-200", ok: true},
		{in: "learn-gh-200", ok: false},                // no owner
		{in: "ntttrang/learn-gh-200/extra", ok: false}, // name would contain a slash
		{in: "/learn-gh-200", ok: false},               // empty owner
		{in: "ntttrang/", ok: false},                   // empty name
		{in: "", ok: false},
	}
	for _, tt := range tests {
		owner, name, err := parseRepository(tt.in)
		if tt.ok {
			if err != nil {
				t.Errorf("parseRepository(%q) unexpected error: %v", tt.in, err)
			}
			if owner != tt.owner || name != tt.name {
				t.Errorf("parseRepository(%q) = %q, %q; want %q, %q", tt.in, owner, name, tt.owner, tt.name)
			}
			continue
		}
		if err == nil {
			t.Errorf("parseRepository(%q) expected error, got %q, %q", tt.in, owner, name)
		}
	}
}

func TestTruncatePayload(t *testing.T) {
	short := "diff --git a/x b/x"
	if got := truncatePayload(short); got != short {
		t.Errorf("truncatePayload changed a short payload: %q", got)
	}

	long := strings.Repeat("a", maxPayloadBytes+1000)
	got := truncatePayload(long)
	if len(got) >= len(long) {
		t.Errorf("truncatePayload did not truncate: len = %d", len(got))
	}
	if !strings.HasSuffix(got, "\n... (truncated)") {
		t.Errorf("truncatePayload missing truncation marker, got suffix %q", got[len(got)-30:])
	}
	if !strings.HasPrefix(got, "aaaa") {
		t.Errorf("truncatePayload lost the payload prefix")
	}
}
