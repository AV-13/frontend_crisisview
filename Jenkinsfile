pipeline {
    agent any

    options {
        timestamps()
        ansiColor('xterm')
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        APP_NAME      = 'crisiview-frontend'
        IMAGE_TAG     = "${env.BUILD_NUMBER}"
        IMAGE_FULL    = "${APP_NAME}:${IMAGE_TAG}"
        IMAGE_LATEST  = "${APP_NAME}:latest"
        DEPLOY_DIR    = '/opt/crisiview/frontend'
        SONAR_SERVER  = 'SonarQube'
        SONAR_SCANNER = 'SonarScanner'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'git rev-parse --short HEAD > .gitcommit'
                script { env.GIT_COMMIT_SHORT = readFile('.gitcommit').trim() }
                echo "Building commit ${env.GIT_COMMIT_SHORT} as build #${env.BUILD_NUMBER}"
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'node -v && npm -v'
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint || true'
            }
        }

        stage('Build Next.js') {
            steps {
                sh 'docker stop sonarqube || true'
                withCredentials([string(credentialsId: 'public-api-url', variable: 'NEXT_PUBLIC_API_URL')]) {
                    sh '''
                        export NEXT_PUBLIC_API_URL
                        export NODE_OPTIONS="--max-old-space-size=1280"
                        npm run build
                    '''
                }
            }
        }

        stage('SAST - SonarQube analysis') {
            steps {
                sh 'docker start sonarqube || true'
                sh '''
                    for i in $(seq 1 60); do
                        if curl -fsS http://sonarqube:9000/api/system/status 2>/dev/null | grep -q "UP"; then
                            echo "Sonar ready after ${i}s"; exit 0
                        fi
                        if curl -fsS http://172.20.10.8:9000/api/system/status 2>/dev/null | grep -q "UP"; then
                            echo "Sonar ready (host) after ${i}s"; exit 0
                        fi
                        sleep 2
                    done
                    echo "Sonar not ready in time"; exit 1
                '''
                script {
                    def scannerHome = tool name: env.SONAR_SCANNER, type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                    withSonarQubeEnv(env.SONAR_SERVER) {
                        sh "${scannerHome}/bin/sonar-scanner -Dsonar.projectVersion=${env.BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Dependency audit (DevSecOps)') {
            steps {
                sh 'mkdir -p reports'
                sh 'npm audit --omit=dev --audit-level=high --json > reports/npm-audit.json || true'
                archiveArtifacts artifacts: 'reports/npm-audit.json',
                                 allowEmptyArchive: true,
                                 fingerprint: true
            }
        }

        stage('Build Docker image') {
            steps {
                withCredentials([string(credentialsId: 'public-api-url', variable: 'NEXT_PUBLIC_API_URL')]) {
                    sh """
                        docker build \
                            --pull \
                            --build-arg NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
                            --label org.opencontainers.image.revision=${env.GIT_COMMIT_SHORT} \
                            --label org.opencontainers.image.version=${env.BUILD_NUMBER} \
                            -t ${IMAGE_FULL} \
                            -t ${IMAGE_LATEST} \
                            .
                    """
                    sh "docker image ls ${APP_NAME}"
                }
            }
        }

        stage('Package image') {
            steps {
                sh "docker save ${IMAGE_LATEST} | gzip > ${APP_NAME}.tar.gz"
                archiveArtifacts artifacts: "${APP_NAME}.tar.gz", fingerprint: true
            }
        }

        stage('Deploy to staging (VM-front)') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'ssh-back',
                                      keyFileVariable: 'SSH_KEY',
                                      usernameVariable: 'SSH_USER'),
                    string(credentialsId: 'vm-front-host',  variable: 'VM_HOST'),
                    string(credentialsId: 'public-api-url', variable: 'NEXT_PUBLIC_API_URL'),
                ]) {
                    sh '''
                        SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
                        ssh -i $SSH_KEY $SSH_OPTS $SSH_USER@$VM_HOST "mkdir -p ${DEPLOY_DIR}"

                        scp -i $SSH_KEY $SSH_OPTS \
                            ${APP_NAME}.tar.gz \
                            deploy/docker-compose.front.yml \
                            $SSH_USER@$VM_HOST:${DEPLOY_DIR}/

                        ssh -i $SSH_KEY $SSH_OPTS $SSH_USER@$VM_HOST "
                            set -e
                            cd ${DEPLOY_DIR}
                            gunzip -c ${APP_NAME}.tar.gz | docker load
                            cat > .env <<EOF
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
FRONTEND_IMAGE=${IMAGE_LATEST}
EOF
                            docker compose -f docker-compose.front.yml --env-file .env up -d --remove-orphans
                            docker compose -f docker-compose.front.yml ps
                        "
                    '''
                }
            }
        }

        stage('Smoke test staging') {
            steps {
                withCredentials([string(credentialsId: 'vm-front-host', variable: 'VM_HOST')]) {
                    sh '''
                        for i in $(seq 1 30); do
                            if curl -fsS http://$VM_HOST:3000/ > /dev/null; then
                                echo "Frontend healthy after ${i} attempt(s)"
                                exit 0
                            fi
                            echo "Waiting for frontend... ($i/30)"
                            sleep 2
                        done
                        echo "Frontend did not come up in time"
                        exit 1
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f --filter label!=org.opencontainers.image.revision=${GIT_COMMIT_SHORT} || true'
        }
        success {
            echo "Pipeline OK - ${IMAGE_FULL} deployed."
        }
        failure {
            echo "Pipeline FAILED - check stage logs."
        }
    }
}
