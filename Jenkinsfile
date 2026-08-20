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

        stage('Selective Build & Detect') {
            steps {
                bat 'path C:\\Program Files\\nodejs;C:\\Users\\adity\\AppData\\Roaming\\npm;%PATH% && node scripts/detect-changed-services.js --build'
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
            echo 'Selective deployment completed successfully'
        }
        failure {
            echo 'Deployment failed - check build logs'
        }
    }
}
