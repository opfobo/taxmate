
import { useParams } from "react-router-dom";

const OcrInvoiceReview = () => {
  const { ocrRequestId } = useParams<{ ocrRequestId: string }>();
  
  return (
    <div>
      <h1>OCR Invoice Review</h1>
      <p>OCR Request ID: {ocrRequestId}</p>
    </div>
  );
};

export default OcrInvoiceReview;
