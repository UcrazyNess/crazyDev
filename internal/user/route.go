package user

import (
	"gorm.io/gorm"

	"crazyDev/pkg/routing"
)

func SetupRouter(r *routing.Router, db *gorm.DB) {
	h := NewHandler(db)
	usrGrp := r.Group("user")
	{
		usrGrp.POST("/singup", h.Rgister)
		usrGrp.POST("/login", h.Rgister)
		usrGrp.PUT("/", h.Update)
		usrGrp.DELETE("/", h.Delete)
		usrGrp.GET("/:id", h.Show)
	}
}
