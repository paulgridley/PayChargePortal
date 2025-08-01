# Azure Deployment Guide

This guide will help you deploy the PCN Payment Portal to Azure App Service using GitHub Actions.

## Prerequisites

- Azure subscription
- GitHub repository containing this code
- Stripe account with API keys
- PostgreSQL database (Azure Database for PostgreSQL or Neon)

## Step 1: Create Azure Resources

### 1.1 Create Resource Group
```bash
az group create --name pcn-payment-rg --location "East US"
```

### 1.2 Create App Service Plan
```bash
az appservice plan create \
  --name pcn-payment-plan \
  --resource-group pcn-payment-rg \
  --sku B1 \
  --is-linux
```

### 1.3 Create Web App
```bash
az webapp create \
  --name pcn-payment-portal \
  --resource-group pcn-payment-rg \
  --plan pcn-payment-plan \
  --runtime "NODE:20-lts"
```

## Step 2: Configure Environment Variables

### 2.1 Set Application Settings in Azure Portal

1. Go to Azure Portal → App Services → pcn-payment-portal
2. Click "Configuration" in the left menu
3. Under "Application settings", add the following:

| Name | Value | Description |
|------|-------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string | Format: `postgresql://user:password@host:port/database?sslmode=require` |
| `STRIPE_SECRET_KEY` | Your Stripe secret key | Starts with `sk_` |
| `VITE_STRIPE_PUBLIC_KEY` | Your Stripe publishable key | Starts with `pk_` |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `8080` | Azure default port |

### 2.2 Alternative: Using Azure CLI
```bash
az webapp config appsettings set \
  --name pcn-payment-portal \
  --resource-group pcn-payment-rg \
  --settings \
    DATABASE_URL="your_postgresql_connection_string" \
    STRIPE_SECRET_KEY="your_stripe_secret_key" \
    VITE_STRIPE_PUBLIC_KEY="your_stripe_public_key" \
    NODE_ENV="production" \
    PORT="8080"
```

## Step 3: Set Up GitHub Actions Deployment

### 3.1 Get Publish Profile
1. In Azure Portal, go to your Web App
2. Click "Get publish profile" and download the `.publishsettings` file
3. Copy the entire contents of this file

### 3.2 Configure GitHub Secrets
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `AZUREAPPSERVICE_PUBLISHPROFILE` | Contents of the `.publishsettings` file |
| `VITE_STRIPE_PUBLIC_KEY` | Your Stripe publishable key |

### 3.3 Update Workflow Configuration
In `.github/workflows/azure-deploy.yml`, update the `AZURE_WEBAPP_NAME` if you used a different name:

```yaml
env:
  AZURE_WEBAPP_NAME: your-webapp-name  # Change this if needed
```

## Step 4: Deploy

### 4.1 Push to Main Branch
```bash
git add .
git commit -m "Add Azure deployment configuration"
git push origin main
```

### 4.2 Monitor Deployment
1. Go to GitHub → Actions tab
2. Watch the deployment workflow run
3. Check the Azure portal for deployment status

## Step 5: Database Setup

### 5.1 If Using Azure Database for PostgreSQL
```bash
# Create Azure PostgreSQL server
az postgres flexible-server create \
  --name pcn-payment-db \
  --resource-group pcn-payment-rg \
  --location "East US" \
  --admin-user pcnadmin \
  --admin-password "YourSecurePassword123!" \
  --version 14 \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32
```

### 5.2 Configure Database Connection
Update your `DATABASE_URL` in Azure App Settings:
```
postgresql://pcnadmin:YourSecurePassword123!@pcn-payment-db.postgres.database.azure.com:5432/postgres?sslmode=require
```

### 5.3 Run Database Migrations
After deployment, your app will automatically run migrations on startup.

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Custom Domain
```bash
az webapp config hostname add \
  --webapp-name pcn-payment-portal \
  --resource-group pcn-payment-rg \
  --hostname yourdomain.com
```

### 6.2 Configure SSL Certificate
```bash
az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI \
  --name pcn-payment-portal \
  --resource-group pcn-payment-rg
```

## Step 7: Testing and Monitoring

### 7.1 Test the Application
1. Visit your Azure Web App URL: `https://pcn-payment-portal.azurewebsites.net`
2. Test the payment flow with Stripe test cards
3. Verify email confirmations are sent

### 7.2 Monitor Application
1. Enable Application Insights in Azure Portal
2. Set up alerts for errors and performance issues
3. Monitor logs in Azure Portal → Log stream

## Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

**Database Connection Issues:**
- Verify DATABASE_URL format
- Check firewall rules for PostgreSQL
- Ensure SSL is required in connection string

**Stripe Integration Issues:**
- Verify both public and secret keys are set
- Check webhook endpoints if using webhooks
- Test with Stripe test mode first

### Viewing Logs
```bash
# View live logs
az webapp log tail --name pcn-payment-portal --resource-group pcn-payment-rg

# Download logs
az webapp log download --name pcn-payment-portal --resource-group pcn-payment-rg
```

## Cost Optimization

- Use B1 tier for development/testing
- Scale to S1+ for production with higher traffic
- Consider Azure Database for PostgreSQL flexible server for cost savings
- Set up auto-scaling rules based on CPU/memory usage

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **SSL/TLS**: Always use HTTPS in production
3. **Database**: Use connection pooling and SSL connections
4. **Stripe**: Use webhooks for payment confirmations
5. **Monitoring**: Set up alerts for unusual activity

## Support

For Azure-specific issues:
- Azure Support: https://azure.microsoft.com/support/
- Azure Documentation: https://docs.microsoft.com/azure/

For application issues:
- Check application logs in Azure Portal
- Review Stripe dashboard for payment issues
- Verify database connectivity and queries