package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGreetWithName(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/greet?name=Captain", nil)
	rec := httptest.NewRecorder()

	newMux().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	var got greetingResponse
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if got.Message != "Ahoy, Captain!" {
		t.Fatalf("message = %q", got.Message)
	}
}

func TestGreetDefault(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/greet", nil)
	rec := httptest.NewRecorder()

	newMux().ServeHTTP(rec, req)

	var got greetingResponse
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if got.Message != "Ahoy, crew!" {
		t.Fatalf("message = %q", got.Message)
	}
}
