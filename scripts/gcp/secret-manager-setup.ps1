$ProjectId = "openstaff-platform"

Write-Host "Create required Secret Manager secrets with placeholder values only." -ForegroundColor Cyan

Write-Host "`nRequired secrets" -ForegroundColor Yellow
Write-Host "gcloud secrets create DATABASE_URL --project=$ProjectId --replication-policy=automatic"
Write-Host "gcloud secrets create JWT_SECRET --project=$ProjectId --replication-policy=automatic"
Write-Host "gcloud secrets create JWT_REFRESH_SECRET --project=$ProjectId --replication-policy=automatic"
Write-Host "gcloud secrets create STRIPE_WEBHOOK_SECRET --project=$ProjectId --replication-policy=automatic"

Write-Host "`nOptional secrets" -ForegroundColor Yellow
Write-Host "gcloud secrets create GEMINI_API_KEY --project=$ProjectId --replication-policy=automatic"
Write-Host "gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY --project=$ProjectId --replication-policy=automatic"

Write-Host "`nAdd versions with your secure operator workflow" -ForegroundColor Yellow
Write-Host "echo 'REPLACE_WITH_SECURE_VALUE' | gcloud secrets versions add DATABASE_URL --project=$ProjectId --data-file=-"
Write-Host "echo 'REPLACE_WITH_SECURE_VALUE' | gcloud secrets versions add JWT_SECRET --project=$ProjectId --data-file=-"
Write-Host "echo 'REPLACE_WITH_SECURE_VALUE' | gcloud secrets versions add JWT_REFRESH_SECRET --project=$ProjectId --data-file=-"
Write-Host "echo 'REPLACE_WITH_SECURE_VALUE' | gcloud secrets versions add STRIPE_WEBHOOK_SECRET --project=$ProjectId --data-file=-"
Write-Host "echo 'REPLACE_WITH_SECURE_VALUE' | gcloud secrets versions add GEMINI_API_KEY --project=$ProjectId --data-file=-"
Write-Host "echo 'REPLACE_WITH_SECURE_VALUE' | gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT_KEY --project=$ProjectId --data-file=-"

Write-Host "`nGrant Cloud Run / Cloud Build access if required" -ForegroundColor Yellow
Write-Host "gcloud secrets add-iam-policy-binding DATABASE_URL --project=$ProjectId --member=serviceAccount:CLOUD_RUN_SERVICE_ACCOUNT --role=roles/secretmanager.secretAccessor"
Write-Host "gcloud secrets add-iam-policy-binding JWT_SECRET --project=$ProjectId --member=serviceAccount:CLOUD_RUN_SERVICE_ACCOUNT --role=roles/secretmanager.secretAccessor"
Write-Host "gcloud secrets add-iam-policy-binding JWT_REFRESH_SECRET --project=$ProjectId --member=serviceAccount:CLOUD_RUN_SERVICE_ACCOUNT --role=roles/secretmanager.secretAccessor"
Write-Host "gcloud secrets add-iam-policy-binding STRIPE_WEBHOOK_SECRET --project=$ProjectId --member=serviceAccount:CLOUD_RUN_SERVICE_ACCOUNT --role=roles/secretmanager.secretAccessor"
