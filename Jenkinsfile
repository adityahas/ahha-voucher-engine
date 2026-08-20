pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    environment {
        NODE_OPTIONS = '--max-old-space-size=2048'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'path C:\\Program Files\\nodejs;C:\\Users\\adity\\AppData\\Roaming\\npm;%PATH% && yarn install --ignore-engines --network-timeout 600000'
            }
        }

        stage('Build') {
            steps {
                bat 'path C:\\Program Files\\nodejs;C:\\Users\\adity\\AppData\\Roaming\\npm;%PATH% && yarn build'
            }
        }

        stage('Build Frontend') {
            steps {
                bat 'path C:\\Program Files\\nodejs;C:\\Users\\adity\\AppData\\Roaming\\npm;%PATH% && cd apps/frontend-cms && yarn install --ignore-engines --network-timeout 600000'
                bat 'path C:\\Program Files\\nodejs;C:\\Users\\adity\\AppData\\Roaming\\npm;%PATH% && cd apps/frontend-cms && npx vite build'
                bat 'path C:\\Program Files\\nodejs;C:\\Users\\adity\\AppData\\Roaming\\npm;%PATH% && cd apps/frontend-consumer && npm install --no-audit --no-fund'
                bat 'path C:\\Program Files\\nodejs;C:\\Users\\adity\\AppData\\Roaming\\npm;%PATH% && cd apps/frontend-consumer && npx vite build'
            }
        }

        stage('Deploy') {
            steps {
                bat 'path C:\\Program Files\\nodejs;C:\\Users\\adity\\AppData\\Roaming\\npm;%PATH% && call deploy.bat'
            }
        }
    }

    post {
        success {
            echo 'Deployment completed successfully'
        }
        failure {
            echo 'Deployment failed - check build logs'
        }
    }
}
