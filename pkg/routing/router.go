package routing

import (
	"github.com/gin-gonic/gin"
)

type Router struct {
	grp *gin.RouterGroup
	app *gin.Engine
}

type routerMethods func(path string, hndlr gin.HandlerFunc)

func (r *Router) GET(path string, hndlr gin.HandlerFunc) {
	r.grp.GET(path, hndlr)
}

func (r *Router) POST(path string, hndlr gin.HandlerFunc) {
	r.grp.POST(path, hndlr)
}

func (r *Router) PUT(path string, hndlr gin.HandlerFunc) {
	r.grp.PUT(path, hndlr)
}

func (r *Router) PATCH(path string, hndlr gin.HandlerFunc) {
	r.grp.PATCH(path, hndlr)
}

func (r *Router) DELETE(path string, hndlr gin.HandlerFunc) {
	r.grp.DELETE(path, hndlr)
}

func (r *Router) Group(path string) *Router {
	return &Router{
		app: r.app,
		grp: r.grp.Group(path),
	}
}

func (r *Router) Exec() *gin.Engine {
	return r.app
}
