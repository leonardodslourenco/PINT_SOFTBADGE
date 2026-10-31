allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    // Exclude :jni — its provider API breaks when build dir is overridden
    if (project.name != "jni") {
        val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
        project.layout.buildDirectory.value(newSubprojectBuildDir)
    }
}
subprojects {
    // Exclude :jni — :app depends on :jni, so applying evaluationDependsOn(:app)
    // to :jni itself creates a circular project evaluation
    if (project.name != "jni") {
        project.evaluationDependsOn(":app")
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
