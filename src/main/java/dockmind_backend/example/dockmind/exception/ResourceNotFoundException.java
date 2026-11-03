package dockmind_backend.example.dockmind.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable ex) {
        super(message, ex);
    }

    public ResourceNotFoundException() {
        super("Resource not found");
    }
}