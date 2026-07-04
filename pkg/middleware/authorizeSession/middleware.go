package authorizeSession

import (
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"crazyDev/migration"
)

func AuthorizeSession(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionToken, err := c.Cookie("session_token")
		if err != nil {
			c.Redirect(http.StatusSeeOther, "/login")
			c.Abort()
			return
		}
		hash := sha256.Sum256([]byte(sessionToken))
		hashedToken := hex.EncodeToString(hash[:])
		var session migration.Session
		err = db.Where("session_token = ?", hashedToken).First(&session).Error
		if err != nil {
			c.Redirect(http.StatusSeeOther, "/login")
			c.Abort()
			return
		}
		if IsExpired(session) {
			db.Delete(&session)
			c.Redirect(http.StatusSeeOther, "/login")
			c.Abort()
			return
		}
		var user migration.User
		err = db.Where("id = ?", session.UserID).First(&user).Error
		if err != nil {
			c.Redirect(http.StatusSeeOther, "/login")
			c.Abort()
			return
		}
		c.Set("user", user)
		c.Next()
	}
}

func DestroySession(db *gorm.DB, c *gin.Context) {
	sessionToken, err := c.Cookie("session_token")
	if err != nil {
		c.SetCookie("session_token", "", -1, "/", "", false, true)
		return
	}
	hash := sha256.Sum256([]byte(sessionToken))
	hashedToken := hex.EncodeToString(hash[:])
	err = db.Where("session_token = ?", hashedToken).Delete(&migration.Session{}).Error
	if err != nil {
		log.Printf("Error deleting session for token %s: %v", hashedToken, err)
	}
	c.SetCookie("session_token", "", -1, "/", "", false, true)
}
