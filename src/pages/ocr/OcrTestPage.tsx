
import OcrUpload from "@/components/ocr/OcrUpload";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const OcrTestPage = () => {
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [ocrHistory, setOcrHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch OCR history for the user
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('ocr_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) {
          console.error("Error fetching OCR history:", error);
        } else {
          setOcrHistory(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch OCR history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, ocrResult]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OCR Document Processing</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <OcrUpload
              onComplete={(result) => {
                console.log("OCR result:", result);
                setOcrResult(result);
              }}
              mode="invoice"
            />
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          {ocrResult && (
            <Card>
              <CardHeader>
                <CardTitle>OCR Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <p className="text-md">{ocrResult.status}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Extracted Data</h3>
                    <div className="text-sm bg-muted p-3 rounded-md mt-1 overflow-auto max-h-[250px]">
                      <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(ocrResult.data, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {ocrHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent OCR Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ocrHistory.map((request) => (
                    <div key={request.id} className="text-sm p-3 border rounded-md">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{request.file_name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.status === 'success' ? 'bg-green-100 text-green-800' : 
                          request.status === 'error' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OcrTestPage;
