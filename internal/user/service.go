package user

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"gorm.io/gorm"
)

func (s Session) GenerateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	plaintextToken := hex.EncodeToString(bytes)
	hash := sha256.Sum256([]byte(plaintextToken))
	s.SessionToken = hex.EncodeToString(hash[:])
	return plaintextToken, nil
}

func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}
func (s *Session) FindSessionByToken(db *gorm.DB, plaintextToken string) (*Session, error) {
	hashedToken := Hash(plaintextToken)
	var session Session
	if err := db.Where("session_token = ?", hashedToken).First(&session).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func Hash(plaintextToken string) string {
	hash := sha256.Sum256([]byte(plaintextToken))
	return hex.EncodeToString(hash[:])
}
