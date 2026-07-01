package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Port         string `mapstructure:"SERVER_PORT"`
	AppEnv       string `mapstructure:"APP_ENV"`
	DBPath       string `mapstructure:"DB_PATH"`
	DbDriver     string `mapstructure:"DB_DRIVER"`
	DebugMode    bool   `mapstructure:"DEBUG_MODE"`
	Jwt_Secret   string `mapstructure:"JWT_SECRET"`
	PublicAccess bool   `mapstructure:"ENABLE_PUBLIC_ACCESS"`
}

var currentConfig *Config

func Load() error {
	v := viper.New()
	v.SetConfigFile("configs/.env")

	if err := v.ReadInConfig(); err != nil {
		return fmt.Errorf("failed to read config: %w", err)
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return fmt.Errorf("failed to unmarshal config: %w", err)
	}

	currentConfig = &cfg
	return nil
}

func Envs() *Config {
	if currentConfig == nil {
		panic("config is not initialized. call conf.Load() first")
	}
	return currentConfig
}
