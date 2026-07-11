package command

import (
	"encoding/json"
)

type CreateCommandRequest struct {
	Alias       string          `json:"alias" binding:"required,max=50"`
	Command     string          `json:"command" binding:"required,max=100"`
	ActionType  string          `json:"action_type" binding:"required,oneof=execute generate"`
	FrameworkID string          `json:"framework_id" binding:"required"`
	Description string          `json:"description"`
	Options     json.RawMessage `json:"options"`
	IsFeatured  bool            `json:"is_featured"`
	File        *string         `json:"file"`
	Filename    *string         `json:"file_name"`
	Path        *string         `json:"path"`
}

type UpdateCommandRequest struct {
	Alias       *string          `json:"alias" binding:"omitempty,max=50"`
	Command     *string          `json:"command" binding:"omitempty,max=100"`
	FrameworkID *string          `json:"framework_id"`
	Description *string          `json:"description"`
	Options     *json.RawMessage `json:"options"`
	SortOrder   *int             `json:"sort_order"`
	IsFeatured  *bool            `json:"is_featured"`
	File        *string          `json:"file"`
	Filename    *string          `json:"file_name"`
	Path        *string          `json:"path"`
}
