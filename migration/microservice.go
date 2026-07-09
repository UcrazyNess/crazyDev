package migration

import (
	"database/sql/driver"
	"fmt"

	"crazyDev/pkg/sqlite"
)

type Microservice struct {
	sqlite.BaseModel

	Name        string          `json:"name" gorm:"type:varchar(100);unique;not null"`
	SourceType  ImageSourceType `json:"source_type" gorm:"type:varchar(20);default:'pull'"`
	Dockerfile  string          `json:"dockerfile" gorm:"type:text"`
	Build       string          `json:"build" gorm:"type:varchar(255)"`
	Image       string          `json:"image" gorm:"type:varchar(255)"`
	Environment string          `json:"environment" gorm:"type:text"`
	Healthcheck string          `json:"healthcheck" gorm:"type:text"`
	Command     string          `json:"command" gorm:"type:text"`
	Restart     string          `json:"restart" gorm:"type:varchar(50);default:'unless-stopped'"`
}

type ImageSourceType string

const (
	SourceBuild ImageSourceType = "build"
	SourcePull  ImageSourceType = "pull"
)

func (st *ImageSourceType) Scan(value interface{}) error {
	if value == nil {
		*st = SourcePull
		return nil
	}
	switch v := value.(type) {
	case string:
		*st = ImageSourceType(v)
		return nil
	case []byte:
		*st = ImageSourceType(v)
		return nil
	default:
		return fmt.Errorf("failed to scan ImageSourceType: unexpected type %T", value)
	}
}

func (st ImageSourceType) Value() (driver.Value, error) {
	return string(st), nil
}
