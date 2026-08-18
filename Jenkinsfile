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

        stage('Test') {
            steps {
                bat 'yarn test --passWithNoTests'
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
