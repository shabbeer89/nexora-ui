# Nexora System Startup Guide

## 🚀 Quick Start

### 1. Pre-flight Check (Recommended)
Before starting services, run the pre-flight check to ensure your environment is ready:

```bash
./preflight-check.sh
```

This will verify:
- ✅ All required commands are installed
- ✅ Directory structure is correct
- ✅ Virtual environments exist
- ✅ Configuration files are present
- ✅ Gateway is built
- ✅ Ports are available

### 2. Start All Services
```bash
./start-nexora.sh
```

This will start services in the correct order:
1. **Gateway** (DEX - Port 15888)
2. **Hummingbot API** (CEX - Port 8000)
3. **FreqTrade** (ML - Port 8080)
4. **Nexora Bot** (Control Plane - Port 8888)
5. **Nexora UI** (Dashboard - Port 3000)

### 3. Stop All Services
```bash
./stop-nexora.sh
```

---

## 📊 Service URLs

Once started, access services at:

| Service | URL | Description |
|---------|-----|-------------|
| **Nexora Dashboard** | http://localhost:3000 | Main UI dashboard |
| **Nexora API** | http://localhost:8888/docs | Control plane API docs |
| **Gateway API** | http://localhost:15888/docs | DEX gateway API docs |
| **Hummingbot API** | http://localhost:8000/docs | CEX API docs |
| **FreqTrade UI** | http://localhost:8080 | ML trading interface |

---

## 🔧 Configuration

### Gateway Passphrase

The Gateway requires a passphrase for wallet encryption. You can set it in two ways:

**Option 1: Environment Variable (Recommended)**
```bash
export GATEWAY_PASSPHRASE="your-secure-passphrase"
./start-nexora.sh
```

**Option 2: Use Default**
If not set, the script uses the default passphrase: `nexora123`

⚠️ **Security Note**: For production use, always set a strong custom passphrase!

---

## 📝 Logs

All service logs are stored in:
```
/home/shabbeer-hussain/AkhaSoft/Nexora/logs/
```

Individual log files:
- `gateway.log` - Gateway service logs
- `gateway_build.log` - Gateway build output
- `hbot_deploy.log` - Hummingbot API deployment logs
- `freqtrade.log` - FreqTrade service logs
- `nexora_bot.log` - Nexora Bot API logs
- `nexora_ui.log` - Nexora UI logs

### Monitor Logs in Real-time
```bash
# All services
tail -f logs/*.log

# Specific service
tail -f logs/nexora_bot.log
```

---

## 🛠️ Troubleshooting

### Service Failed to Start

1. **Check the logs**:
   ```bash
   cat logs/<service>.log
   ```

2. **Verify the service is not already running**:
   ```bash
   lsof -i:<port>
   ```

3. **Run preflight check**:
   ```bash
   ./preflight-check.sh
   ```

### Gateway Build Failed

If Gateway fails to build:
```bash
cd hbot/gateway
pnpm install
pnpm run build
```

### Port Already in Use

The start script automatically kills processes on required ports. If you see warnings, the script will handle it.

To manually check ports:
```bash
lsof -i:3000   # Nexora UI
lsof -i:8888   # Nexora Bot
lsof -i:8080   # FreqTrade
lsof -i:8000   # Hummingbot API
lsof -i:15888  # Gateway
```

### Hummingbot API Not Starting

If Hummingbot API is not setup:
```bash
cd hbot/hummingbot-api
make setup
```

### Virtual Environment Not Found

**FreqTrade:**
```bash
cd freqtrade
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Nexora Bot:**
```bash
cd nexora-bot
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🔄 Automatic Rollback

The start script includes automatic rollback functionality:
- If any service fails to start, all previously started services are stopped
- This prevents the system from being left in an inconsistent state
- Check logs to identify which service failed

---

## 🎯 Advanced Usage

### Start with Custom Passphrase
```bash
GATEWAY_PASSPHRASE="my-secure-pass" ./start-nexora.sh
```

### Check Service Status
```bash
# Check if all services are running
lsof -i:3000 -i:8888 -i:8080 -i:8000 -i:15888
```

### Restart a Single Service

**Example: Restart Nexora Bot**
```bash
# Kill the service
kill $(lsof -t -i:8888)

# Restart it
cd nexora-bot
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)
nohup uvicorn src.api.main:app --host 0.0.0.0 --port 8888 > ../logs/nexora_bot.log 2>&1 &
```

---

## 📋 System Requirements

### Required Software
- ✅ **Node.js** v20+ (for Gateway and UI)
- ✅ **pnpm** (for Gateway)
- ✅ **npm** (for UI)
- ✅ **Python 3.8+** (for FreqTrade and Nexora Bot)
- ✅ **Docker** (for Hummingbot API)
- ✅ **make** (for Hummingbot API)
- ✅ **lsof** (for port management)

### Optional
- Docker Compose (included with Docker)

---

## 🔐 Security Best Practices

1. **Set a strong Gateway passphrase** before production use
2. **Restrict access** to the logs directory (contains sensitive data)
3. **Use HTTPS** in production (configure reverse proxy)
4. **Firewall rules** to restrict access to service ports
5. **Regular backups** of configuration and wallet files

---

## 📚 Additional Resources

- [Gateway Documentation](hbot/gateway/README.md)
- [Hummingbot API Documentation](hbot/hummingbot-api/README.md)
- [FreqTrade Documentation](https://www.freqtrade.io/en/stable/)
- [Nexora Bot Documentation](nexora-bot/README.md)

---

## 🐛 Known Issues

### Issue: Gateway Passphrase Warning
**Symptom**: Warning about using default passphrase  
**Solution**: Set `GATEWAY_PASSPHRASE` environment variable

### Issue: Hummingbot API Skipped
**Symptom**: "hummingbot-api not setup" message  
**Solution**: Run `make setup` in `hbot/hummingbot-api` directory

---

## 📞 Support

If you encounter issues:
1. Check the logs in `logs/` directory
2. Run `./preflight-check.sh` to diagnose environment issues
3. Review the [STARTUP_SCRIPT_AUDIT.md](STARTUP_SCRIPT_AUDIT.md) for detailed fix information

---

**Last Updated:** 2026-01-19  
**Script Version:** 2.0 (Fixed & Enhanced)
