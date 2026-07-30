FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./
RUN mvn --batch-mode dependency:go-offline
COPY src ./src
RUN mvn --batch-mode package -DskipTests

FROM eclipse-temurin:21-jre-noble
WORKDIR /app
RUN groupadd --system educhain && useradd --system --gid educhain --home-dir /app educhain
COPY --from=build /workspace/target/educhain-server-0.1.0.jar /app/server.jar
USER educhain
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/server.jar"]
