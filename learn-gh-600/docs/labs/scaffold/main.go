package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

type greetingResponse struct {
	Message string `json:"message"`
}

func greetHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		name = "crew"
	}

	writeJSON(w, http.StatusOK, greetingResponse{
		Message: "Ahoy, " + name + "!",
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		log.Printf("write json: %v", err)
	}
}

func newMux() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/greet", greetHandler)
	return mux
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("corgi-greeter listening on :%s", port)
	if err := http.ListenAndServe(":"+port, newMux()); err != nil {
		log.Fatal(err)
	}
}
