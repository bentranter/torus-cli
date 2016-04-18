package main

import "os"
import "fmt"
import "path"
import "errors"

var version = "development"

const REQUIRED_PERM = 0700

type Config struct {
	ArigatoRoot string
	SocketPath  string
	PidPath     string
	Version     string
}

func NewConfig(arigatoRoot string) (*Config, error) {
	if len(arigatoRoot) == 0 {
		arigatoRoot = path.Join(os.Getenv("HOME"), ".arigato")
	}

	src, err := os.Stat(arigatoRoot)
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}

	if err == nil && !src.IsDir() {
		return nil, errors.New(
			fmt.Sprintf("%s exists but is not a dir", arigatoRoot))
	}

	if os.IsNotExist(err) {
		err = os.Mkdir(arigatoRoot, REQUIRED_PERM)
		if err != nil {
			return nil, err
		}

		src, err = os.Stat(arigatoRoot)
		if err != nil {
			return nil, err
		}
	}

	fMode := src.Mode()
	if fMode.Perm() != REQUIRED_PERM {
		return nil, errors.New(fmt.Sprintf(
			"%s has permissions %d requires %d",
			arigatoRoot, fMode.Perm(), REQUIRED_PERM))
	}

	cfg := &Config{
		ArigatoRoot: arigatoRoot,
		SocketPath:  path.Join(arigatoRoot, "daemon.socket"),
		PidPath:     path.Join(arigatoRoot, "daemon.pid"),
		Version:     version,
	}

	return cfg, nil
}
