# syntax=docker/dockerfile:1

FROM golang:1.22-bookworm AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/corgi-greeter .

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/corgi-greeter /app/corgi-greeter
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/corgi-greeter"]
