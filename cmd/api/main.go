package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"crazyDev/internal/command"
	"crazyDev/internal/compose"
	"crazyDev/internal/framework"
	"crazyDev/internal/microservice"
	"crazyDev/internal/user"
	"crazyDev/migration"
	"crazyDev/pkg/config"
	"crazyDev/pkg/middleware/authorizeSession"
	"crazyDev/pkg/routing"
	"crazyDev/pkg/serve"
	"crazyDev/pkg/sqlite"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatalf("cant load configs %s", err)
	}
	db, err := sqlite.NewDB(config.Envs().DBPath)
	migrations := []sqlite.Migration{
		{Model: &migration.User{}, TableName: "Users"},
		{Model: &migration.Session{}, TableName: "session"},
		{Model: &migration.Framework{}, TableName: "framework"},
		{Model: &migration.Command{}, TableName: "command"},
		{Model: &migration.Microservice{}, TableName: "microservice"},
		{Model: &migration.DockerCompose{}, TableName: "docker_compose"},
		{Model: &migration.ComposeIP{}, TableName: "compose_ip"},
	}
	sqlite.RunMigrations(db, migrations...)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	serve := serve.NewServe(serve.WithPort(config.Envs().Port), serve.PublicAccess(config.Envs().PublicAccess))
	router := routing.SetupRouter(routing.WithLogger(config.Envs().DebugMode))
	router.GET("/", func(ctx *gin.Context) {
		ctx.HTML(http.StatusOK, "welcome.html", gin.H{})
	})
	router.GET("/login", func(ctx *gin.Context) {
		ctx.HTML(http.StatusOK, "login.html", gin.H{})
	})
	router.GET("/signup", func(ctx *gin.Context) {
		ctx.HTML(http.StatusOK, "signup.html", gin.H{})
	})
	router.WithMiddlewares(authorizeSession.AuthorizeSession(db)).GET("/dashboard", func(ctx *gin.Context) {
		ctx.HTML(http.StatusOK, "dashboard.html", gin.H{})
	})
	router.WithMiddlewares(authorizeSession.AuthorizeSession(db)).GET("/frameworks", func(ctx *gin.Context) {
		ctx.HTML(http.StatusOK, "frameworks.html", gin.H{})
	})
	router.WithMiddlewares(authorizeSession.AuthorizeSession(db)).GET("/microservices", func(ctx *gin.Context) {
		ctx.HTML(http.StatusOK, "microservices.html", gin.H{})
	})
	router.WithMiddlewares(authorizeSession.AuthorizeSession(db)).GET("/composes", func(ctx *gin.Context) {
		ctx.HTML(http.StatusOK, "compose.html", gin.H{})
	})

	user.SetupRouter(router, db)
	framework.SetupRouter(router, db)
	command.SetupRouter(router, db)
	microservice.SetupRouter(router, db)
	compose.SetupRouter(router, db)
	serve.Serve(router.Exec())

}
