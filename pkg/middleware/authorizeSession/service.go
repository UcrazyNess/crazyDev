package authorizeSession

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"crazyDev/migration"
)

func GenerateSessionToken(s *migration.Session) (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	plaintextToken := hex.EncodeToString(bytes)
	hash := sha256.Sum256([]byte(plaintextToken))
	hashedToken := hex.EncodeToString(hash[:])
	s.SessionToken = hashedToken
	return plaintextToken, nil
}

func IsExpired(s migration.Session) bool {
	return time.Now().After(s.ExpiresAt)
}

func Hash(plaintextToken string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plaintextToken), bcrypt.DefaultCost)
	return string(hash), err
}

func Authorize(db *gorm.DB, user migration.User) (string, error) {
	session := migration.Session{
		UserID:       user.ID,
		SessionToken: "",
		ExpiresAt:    time.Now().Add(24 * time.Hour), // عمر ۲۴ ساعته سشن
	}
	plaintextToken, err := GenerateSessionToken(&session)
	if err != nil {
		return "", err
	}
	if err := db.Create(&session).Error; err != nil {

		return "", err
	}
	return plaintextToken, nil

}
