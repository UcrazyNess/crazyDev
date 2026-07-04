package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"crazyDev/internal/user"
	"crazyDev/migration"
	"crazyDev/pkg/config"
	"crazyDev/pkg/dbsqli"
	"crazyDev/pkg/middleware/authorizeSession"
	"crazyDev/pkg/routing"
	"crazyDev/pkg/serve"
)

func main() {
	config.Load()
	db, err := dbsqli.NewDB(config.Envs().DBPath)
	migrations := []dbsqli.Migration{
		{Model: &migration.User{}, TableName: "Users"},
		{Model: &migration.Session{}, TableName: "session"},
	}
	dbsqli.RunMigrations(db, migrations...)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	serve := serve.NewServe(serve.WithPort(config.Envs().Port), serve.PublicAccess(config.Envs().PublicAccess))
	router := routing.SetupRouter(routing.WithLoger(config.Envs().DebugMode))
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

	user.SetupRouter(router, db)
	serve.Serve(router.Exec())
}
