package migration

import (
	"database/sql/driver"
	"fmt"

	"crazyDev/pkg/sqlite"
)

type Command struct {
	sqlite.BaseModel

	Alias       string            `json:"alias" gorm:"type:varchar(50)"`
	ActionType  CommandActionType `json:"action_type" gorm:"type:varchar(20);default:'execute'"`
	Command     string            `json:"command" gorm:"type:varchar(100)"`
	FrameworkID string            `json:"framework_id" gorm:"index"`
	Framework   Framework         `json:"-" gorm:"foreignKey:FrameworkID;constraint:OnDelete:CASCADE;"`
	Description string            `json:"description" gorm:"type:text"`
	Options     string            `json:"options" gorm:"type:text"`
	SortOrder   *int              `json:"sort_order" gorm:"column:sort_order"`
	IsFeatured  bool              `json:"is_featured" gorm:"default:false"`
	Path        string            `json:"paths" grom:"type:varchar(250)"`
	FilePath    string            `json:"file_path" grom:"type:varchar(250)"`
}
type CommandActionType string

const (
	Execute  CommandActionType = "execute"
	Generate CommandActionType = "generate"
)

func (cat *CommandActionType) Scan(value interface{}) error {
	if value == nil {
		*cat = Execute
		return nil
	}
	switch v := value.(type) {
	case string:
		*cat = CommandActionType(v)
		return nil
	case []byte:
		*cat = CommandActionType(v)
		return nil
	default:
		return fmt.Errorf("failed to scan CommandActionType: unexpected type %T", value)
	}
}

func (cat CommandActionType) Value() (driver.Value, error) {
	return string(cat), nil
}
