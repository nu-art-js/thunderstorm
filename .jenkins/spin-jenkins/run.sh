#!/bin/bash

# before you start, enable the Kubernetes Engine API
# here: https://console.cloud.google.com/apis/api/container.googleapis.com/metrics?project=${JenkinsProjectId}

gcloud config set project ${JenkinsProjectId}
gcloud container clusters create jenkins-cluster --num-nodes=1 --machine-type=e2-medium --region us-central1
gcloud container clusters get-credentials jenkins-cluster --region us-central1
kubectl apply -f jenkins-deployment.yaml
kubectl apply -f jenkins-service.yaml
kubectl get service jenkins-service
