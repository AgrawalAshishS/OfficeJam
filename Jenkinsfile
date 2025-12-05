pipeline {
    agent { label 'docker_build_agent2' }

    options {
        buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '10') 
    }


    stages{

        stage('Checkout SCM'){
            steps{
                // cleanWs()
                checkout scm
            }
        }


        stage('Processing For Develop Branch'){
            
            when{
                branch "feature/docker-setup"
            } 


            stages{
                stage('Building Image for development'){
                    steps{
                        sh 'docker build . -t registry.toshalinfotech.com/office_jame:0.$BUILD_NUMBER'
                    }
                }

                stage('push to registry'){
                    steps{
                        sh 'docker push registry.toshalinfotech.com/office_jame:0.$BUILD_NUMBER'
                    }
                }

                stage('deploy docker image to Mysandbox'){
                    steps{
                        sh 'echo presidentbatteries = registry.toshalinfotech.com/office_jame:0.$BUILD_NUMBER > .env'
                        sh 'echo publish_env=dev >> .env'
                        sh 'docker compose --env-file .env up -d'
                    }
                }
            }
        }

    }
    
}