package dockmind_backend.example.dockmind.exception;




public class DocumentProcessingException extends RuntimeException {
   public  DocumentProcessingException(String message){
       super( message);
   }
   public DocumentProcessingException(){
        super("Error in processing document");
   }
   public DocumentProcessingException(String message, Throwable cause){
       super(message,cause);
   }
}
