.DEFAULT_GOAL := start

API_DIR := api
FRONTEND_DIR := pro
RUNTIME_DIR := .runtime
LOG_DIR := $(RUNTIME_DIR)/logs
API_PID_FILE := $(RUNTIME_DIR)/api.pid
FRONTEND_PID_FILE := $(RUNTIME_DIR)/frontend.pid
API_OUT_LOG := $(LOG_DIR)/api.out.log
API_ERR_LOG := $(LOG_DIR)/api.err.log
FRONTEND_OUT_LOG := $(LOG_DIR)/frontend.out.log
FRONTEND_ERR_LOG := $(LOG_DIR)/frontend.err.log

.ONESHELL:
.PHONY: start setup stop status logs help clean

ifeq ($(OS),Windows_NT)
SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -ExecutionPolicy Bypass -Command
NPM := npm.cmd

start: setup
	if (!(Test-Path '$(RUNTIME_DIR)')) { New-Item -ItemType Directory -Path '$(RUNTIME_DIR)' | Out-Null }
	if (!(Test-Path '$(LOG_DIR)')) { New-Item -ItemType Directory -Path '$(LOG_DIR)' | Out-Null }

	if (Test-Path '$(API_PID_FILE)') {
	  $apiPid = (Get-Content '$(API_PID_FILE)' | Select-Object -First 1)
	  if ($apiPid -and !(Get-Process -Id $apiPid -ErrorAction SilentlyContinue)) {
	    Remove-Item '$(API_PID_FILE)' -Force
	  }
	}

	if (Test-Path '$(FRONTEND_PID_FILE)') {
	  $frontendPid = (Get-Content '$(FRONTEND_PID_FILE)' | Select-Object -First 1)
	  if ($frontendPid -and !(Get-Process -Id $frontendPid -ErrorAction SilentlyContinue)) {
	    Remove-Item '$(FRONTEND_PID_FILE)' -Force
	  }
	}

	if (Test-Path '$(API_PID_FILE)') {
	  $apiPid = (Get-Content '$(API_PID_FILE)' | Select-Object -First 1)
	  Write-Host "Backend already running with PID $apiPid"
	} else {
	  $apiProcess = Start-Process -FilePath '$(NPM)' -ArgumentList @('run', 'start') -WorkingDirectory '$(API_DIR)' -RedirectStandardOutput '$(API_OUT_LOG)' -RedirectStandardError '$(API_ERR_LOG)' -PassThru
	  Set-Content -Path '$(API_PID_FILE)' -Value $apiProcess.Id
	  Write-Host "Started backend with PID $($apiProcess.Id)"
	}

	if (Test-Path '$(FRONTEND_PID_FILE)') {
	  $frontendPid = (Get-Content '$(FRONTEND_PID_FILE)' | Select-Object -First 1)
	  Write-Host "Frontend already running with PID $frontendPid"
	} else {
	  $frontendProcess = Start-Process -FilePath '$(NPM)' -ArgumentList @('run', 'start') -WorkingDirectory '$(FRONTEND_DIR)' -RedirectStandardOutput '$(FRONTEND_OUT_LOG)' -RedirectStandardError '$(FRONTEND_ERR_LOG)' -PassThru
	  Set-Content -Path '$(FRONTEND_PID_FILE)' -Value $frontendProcess.Id
	  Write-Host "Started frontend with PID $($frontendProcess.Id)"
	}

	Write-Host ''
	Write-Host 'Sync-Not-Net services are starting.'
	Write-Host 'Frontend: http://localhost:3000'
	Write-Host 'Backend:  http://localhost:5000'
	Write-Host "Use 'make logs' to follow output and 'make stop' to stop both services."

setup:
	if (!(Test-Path '$(RUNTIME_DIR)')) { New-Item -ItemType Directory -Path '$(RUNTIME_DIR)' | Out-Null }
	if (!(Test-Path '$(LOG_DIR)')) { New-Item -ItemType Directory -Path '$(LOG_DIR)' | Out-Null }

	if (!(Test-Path '$(API_DIR)\\.env') -and (Test-Path '$(API_DIR)\\.env.example')) {
	  Copy-Item '$(API_DIR)\\.env.example' '$(API_DIR)\\.env'
	  Write-Host 'Created api/.env from api/.env.example. Review the values before sharing or deploying.'
	}

	if (!(Test-Path '$(FRONTEND_DIR)\\.env')) {
	  Set-Content -Path '$(FRONTEND_DIR)\\.env' -Value 'REACT_APP_BACKEND_URL=http://localhost:5000'
	  Write-Host 'Created pro/.env with the default backend URL.'
	}

	if (!(Test-Path '$(API_DIR)\\node_modules')) {
	  Push-Location '$(API_DIR)'
	  & '$(NPM)' install
	  Pop-Location
	} else {
	  Write-Host 'Backend dependencies already installed.'
	}

	if (!(Test-Path '$(FRONTEND_DIR)\\node_modules')) {
	  Push-Location '$(FRONTEND_DIR)'
	  & '$(NPM)' install
	  Pop-Location
	} else {
	  Write-Host 'Frontend dependencies already installed.'
	}

stop:
	if (Test-Path '$(API_PID_FILE)') {
	  $apiPid = (Get-Content '$(API_PID_FILE)' | Select-Object -First 1)
	  if ($apiPid -and (Get-Process -Id $apiPid -ErrorAction SilentlyContinue)) {
	    Stop-Process -Id $apiPid -Force
	    Write-Host "Stopped backend PID $apiPid"
	  }
	  Remove-Item '$(API_PID_FILE)' -Force
	} else {
	  Write-Host 'Backend is not running from this Makefile.'
	}

	if (Test-Path '$(FRONTEND_PID_FILE)') {
	  $frontendPid = (Get-Content '$(FRONTEND_PID_FILE)' | Select-Object -First 1)
	  if ($frontendPid -and (Get-Process -Id $frontendPid -ErrorAction SilentlyContinue)) {
	    Stop-Process -Id $frontendPid -Force
	    Write-Host "Stopped frontend PID $frontendPid"
	  }
	  Remove-Item '$(FRONTEND_PID_FILE)' -Force
	} else {
	  Write-Host 'Frontend is not running from this Makefile.'
	}

status:
	if (Test-Path '$(API_PID_FILE)') {
	  $apiPid = (Get-Content '$(API_PID_FILE)' | Select-Object -First 1)
	  if ($apiPid -and (Get-Process -Id $apiPid -ErrorAction SilentlyContinue)) {
	    Write-Host "Backend: running (PID $apiPid)"
	  } else {
	    Write-Host 'Backend: stale PID file found'
	  }
	} else {
	  Write-Host 'Backend: stopped'
	}

	if (Test-Path '$(FRONTEND_PID_FILE)') {
	  $frontendPid = (Get-Content '$(FRONTEND_PID_FILE)' | Select-Object -First 1)
	  if ($frontendPid -and (Get-Process -Id $frontendPid -ErrorAction SilentlyContinue)) {
	    Write-Host "Frontend: running (PID $frontendPid)"
	  } else {
	    Write-Host 'Frontend: stale PID file found'
	  }
	} else {
	  Write-Host 'Frontend: stopped'
	}

logs:
	if (!(Test-Path '$(API_OUT_LOG)')) { New-Item -ItemType File -Path '$(API_OUT_LOG)' -Force | Out-Null }
	if (!(Test-Path '$(API_ERR_LOG)')) { New-Item -ItemType File -Path '$(API_ERR_LOG)' -Force | Out-Null }
	if (!(Test-Path '$(FRONTEND_OUT_LOG)')) { New-Item -ItemType File -Path '$(FRONTEND_OUT_LOG)' -Force | Out-Null }
	if (!(Test-Path '$(FRONTEND_ERR_LOG)')) { New-Item -ItemType File -Path '$(FRONTEND_ERR_LOG)' -Force | Out-Null }
	Get-Content -Path '$(API_OUT_LOG)', '$(API_ERR_LOG)', '$(FRONTEND_OUT_LOG)', '$(FRONTEND_ERR_LOG)' -Wait

help:
	Write-Host 'Available targets:'
	Write-Host '  make        Start frontend and backend'
	Write-Host '  make setup  Install dependencies and create missing env files'
	Write-Host '  make stop   Stop both services started by the Makefile'
	Write-Host '  make status Show current service status'
	Write-Host '  make logs   Tail backend and frontend log files'
	Write-Host '  make clean  Stop services and remove runtime files'

clean: stop
	if (Test-Path '$(RUNTIME_DIR)') {
	  Remove-Item '$(RUNTIME_DIR)' -Recurse -Force
	}

else
SHELL := /bin/bash
.SHELLFLAGS := -ec
NPM := npm

start: setup
	mkdir -p "$(LOG_DIR)"
	if [ -f "$(API_PID_FILE)" ] && kill -0 "$$(cat "$(API_PID_FILE)")" 2>/dev/null; then
	  echo "Backend already running with PID $$(cat "$(API_PID_FILE)")"
	else
	  rm -f "$(API_PID_FILE)"
	  (
	    cd "$(API_DIR)"
	    nohup $(NPM) run start > "../$(API_OUT_LOG)" 2> "../$(API_ERR_LOG)" < /dev/null &
	    echo $$! > "../$(API_PID_FILE)"
	  )
	  echo "Started backend with PID $$(cat "$(API_PID_FILE)")"
	fi
	if [ -f "$(FRONTEND_PID_FILE)" ] && kill -0 "$$(cat "$(FRONTEND_PID_FILE)")" 2>/dev/null; then
	  echo "Frontend already running with PID $$(cat "$(FRONTEND_PID_FILE)")"
	else
	  rm -f "$(FRONTEND_PID_FILE)"
	  (
	    cd "$(FRONTEND_DIR)"
	    nohup $(NPM) run start > "../$(FRONTEND_OUT_LOG)" 2> "../$(FRONTEND_ERR_LOG)" < /dev/null &
	    echo $$! > "../$(FRONTEND_PID_FILE)"
	  )
	  echo "Started frontend with PID $$(cat "$(FRONTEND_PID_FILE)")"
	fi
	echo
	echo 'Sync-Not-Net services are starting.'
	echo 'Frontend: http://localhost:3000'
	echo 'Backend:  http://localhost:5000'
	echo "Use 'make logs' to follow output and 'make stop' to stop both services."

setup:
	mkdir -p "$(LOG_DIR)"
	if [ ! -f "$(API_DIR)/.env" ] && [ -f "$(API_DIR)/.env.example" ]; then
	  cp "$(API_DIR)/.env.example" "$(API_DIR)/.env"
	  echo 'Created api/.env from api/.env.example. Review the values before sharing or deploying.'
	fi
	if [ ! -f "$(FRONTEND_DIR)/.env" ]; then
	  printf 'REACT_APP_BACKEND_URL=http://localhost:5000\n' > "$(FRONTEND_DIR)/.env"
	  echo 'Created pro/.env with the default backend URL.'
	fi
	if [ ! -d "$(API_DIR)/node_modules" ]; then
	  (
	    cd "$(API_DIR)"
	    $(NPM) install
	  )
	else
	  echo 'Backend dependencies already installed.'
	fi
	if [ ! -d "$(FRONTEND_DIR)/node_modules" ]; then
	  (
	    cd "$(FRONTEND_DIR)"
	    $(NPM) install
	  )
	else
	  echo 'Frontend dependencies already installed.'
	fi

stop:
	if [ -f "$(API_PID_FILE)" ]; then
	  API_PID="$$(cat "$(API_PID_FILE)")"
	  if kill -0 "$$API_PID" 2>/dev/null; then
	    kill "$$API_PID"
	    echo "Stopped backend PID $$API_PID"
	  fi
	  rm -f "$(API_PID_FILE)"
	else
	  echo 'Backend is not running from this Makefile.'
	fi
	if [ -f "$(FRONTEND_PID_FILE)" ]; then
	  FRONTEND_PID="$$(cat "$(FRONTEND_PID_FILE)")"
	  if kill -0 "$$FRONTEND_PID" 2>/dev/null; then
	    kill "$$FRONTEND_PID"
	    echo "Stopped frontend PID $$FRONTEND_PID"
	  fi
	  rm -f "$(FRONTEND_PID_FILE)"
	else
	  echo 'Frontend is not running from this Makefile.'
	fi

status:
	if [ -f "$(API_PID_FILE)" ] && kill -0 "$$(cat "$(API_PID_FILE)")" 2>/dev/null; then
	  echo "Backend: running (PID $$(cat "$(API_PID_FILE)"))"
	else
	  echo 'Backend: stopped'
	fi
	if [ -f "$(FRONTEND_PID_FILE)" ] && kill -0 "$$(cat "$(FRONTEND_PID_FILE)")" 2>/dev/null; then
	  echo "Frontend: running (PID $$(cat "$(FRONTEND_PID_FILE)"))"
	else
	  echo 'Frontend: stopped'
	fi

logs:
	mkdir -p "$(LOG_DIR)"
	touch "$(API_OUT_LOG)" "$(API_ERR_LOG)" "$(FRONTEND_OUT_LOG)" "$(FRONTEND_ERR_LOG)"
	tail -f "$(API_OUT_LOG)" "$(API_ERR_LOG)" "$(FRONTEND_OUT_LOG)" "$(FRONTEND_ERR_LOG)"

help:
	echo 'Available targets:'
	echo '  make        Start frontend and backend'
	echo '  make setup  Install dependencies and create missing env files'
	echo '  make stop   Stop both services started by the Makefile'
	echo '  make status Show current service status'
	echo '  make logs   Tail backend and frontend log files'
	echo '  make clean  Stop services and remove runtime files'

clean: stop
	rm -rf "$(RUNTIME_DIR)"

endif