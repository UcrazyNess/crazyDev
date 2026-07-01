package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Session interface {
	IsExpiresed() bool
	SetUser(c *gin.Context)
}

func AuthorizeSession(db *gorm.DB, FindSessionByToken func(db *gorm.DB, sessionToken string) (Session, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionToken, err := c.Cookie("session_token")
		if err != nil {
			c.Redirect(http.StatusSeeOther, "/login")
			c.Abort()
			return
		}
		session, err := FindSessionByToken(db, sessionToken)
		if err != nil {
			c.Redirect(http.StatusSeeOther, "/login")
			c.Abort()
			return
		}
		if session.IsExpiresed() {
			db.Delete(&session) // حذف سشن منقضی شده
			c.Redirect(http.StatusSeeOther, "/login")
			c.Abort()
			return
		}
		session.SetUser(c)
		c.Next()
	}
}
