package serve

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

type HttpServe struct {
	options options
	server  *http.Server
}

type options struct {
	Ip   string
	Port string
}
type Option func(option *options)

func NewServe(opts ...Option) *HttpServe {
	serv := HttpServe{
		options: options{
			Ip:   "127.0.0.1",
			Port: "8080",
		},
	}
	for _, opt := range opts {
		opt(&serv.options)
	}
	return &serv
}

func WithPort(port string) Option {
	return func(option *options) {
		option.Port = port
	}
}
func PublicAccess(allow bool) Option {
	return func(option *options) {
		if allow {
			option.Ip = "0.0.0.0"
		}
	}
}
func (serv *HttpServe) Serve(handler http.Handler) {
	fullAddr := fmt.Sprintf("%s:%s", serv.options.Ip, serv.options.Port)
	serv.server = &http.Server{
		Addr:    fullAddr,
		Handler: handler,
	}
	go func() {
		log.Printf("Server is running on http://%s", fullAddr)
		if err := serv.server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Listen error: %s\n", err)
		}
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := serv.server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exited cleanly.")
}
