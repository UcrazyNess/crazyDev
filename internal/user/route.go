package user

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"crazyDev/pkg/middleware/authorizeSession"
	"crazyDev/pkg/routing"
)

func SetupRouter(r *routing.Router, db *gorm.DB) {
	h := NewHandler(db)
	usrGrp := r.Group("user")
	{
		usrGrp.POST("/singup", h.Register)
		usrGrp.POST("/login", h.Login)
		//usrGrp.PUT("/", h.Update)
		//usrGrp.DELETE("/", h.Delete)
		usrGrp.GET("/logout", func(ctx *gin.Context) {
			authorizeSession.DestroySession(db, ctx)
			ctx.Redirect(302, "/login")
		})
		usrGrp.WithMiddlewares(authorizeSession.AuthorizeSession(db)).GET("/me", h.Show)
	}
}
