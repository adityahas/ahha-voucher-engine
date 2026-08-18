pipeline {
    agent any

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
                bat 'yarn install --ignore-engines --network-timeout 600000'
            }
        }

        stage('Build') {
            steps {
                bat 'yarn build'
            }
        }

        stage('Build Frontend') {
            steps {
                bat 'cd apps/frontend-cms && npx vite build'
                bat 'cd apps/frontend-consumer && npx vite build'
            }
        }

        stage('Test') {
            environment {
                NODE_OPTIONS = '--max-old-space-size=1024'
            }
            steps {
                bat 'set NODE_OPTIONS=--max-old-space-size=1024 && yarn test --maxWorkers=1 --passWithNoTests'
            }
        }

        stage('Deploy') {
            steps {
                bat 'call deploy.bat'
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
