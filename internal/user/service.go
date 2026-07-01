package user

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func (s *Session) GenerateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	plaintextToken := hex.EncodeToString(bytes)
	hash, err := Hash(plaintextToken)
	if err != nil {
		return "", err
	}
	s.SessionToken = hash
	return plaintextToken, nil
}

func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}
func (s *Session) FindSessionByToken(db *gorm.DB, plaintextToken string) (*Session, error) {
	hashedToken, err := Hash(plaintextToken)
	if err != nil {
		return nil, err
	}
	var session Session
	if err := db.Where("session_token = ?", hashedToken).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func Hash(plaintextToken string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(plaintextToken), bcrypt.DefaultCost)
	return string(hash), err
}
