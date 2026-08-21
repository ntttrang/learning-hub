APP := corgi-greeter
IMAGE ?= $(APP):local

.PHONY: build test run docker

build:
	go build ./...

test:
	go test -cover ./...

run:
	go run .

docker:
	docker build -t $(IMAGE) .
