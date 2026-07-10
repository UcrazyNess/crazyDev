package routing

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Option func(*gin.Engine)

func SetupRouter(opts ...Option) *Router {

	app := gin.New()
	app.Use(gin.CustomRecovery(func(c *gin.Context, err any) {
		recovery(c, err)
	}))
	for _, opt := range opts {
		opt(app)
	}
	app.LoadHTMLGlob("./public/views/*")
	app.Static("/static", "./public")
	app.Static("/storage", "./storage")
	app.NoRoute(func(ctx *gin.Context) {
		ctx.HTML(http.StatusNotFound, "404.html", gin.H{})
	})
	group := app.Group("/")
	return &Router{
		grp: group,
		app: app,
	}
}

func WithLogger(allow bool) Option {
	return func(e *gin.Engine) {
		if allow {
			e.Use(gin.Logger())
		}
	}
}

func (r *Router) WithMiddlewares(mdlwrs ...gin.HandlerFunc) *Router {
	newGrp := r.grp.Group("/")
	newGrp.Use(mdlwrs...)
	return &Router{
		grp: newGrp,
		app: r.app,
	}
}
