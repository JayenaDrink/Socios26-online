import { NextResponse } from 'next/server';
import { getMailChimpService } from '@/lib/mailchimp';

export async function GET() {
  try {
    const mailchimp = getMailChimpService();
    
    if (!mailchimp) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: 'MailChimp not configured. Please set MAILCHIMP_API_KEY, MAILCHIMP_SERVER_PREFIX, and MAILCHIMP_AUDIENCE_ID in your environment variables.'
      });
    }

    const connectionTest = await mailchimp.testConnection();
    
    if (connectionTest.connected) {
      const audienceInfo = await mailchimp.getAudienceInfo();
      
      return NextResponse.json({
        success: true,
        configured: true,
        connected: true,
        audience: audienceInfo
      });
    } else {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: false,
        error: connectionTest.error
      });
    }
  } catch (error) {
    console.error('Error checking MailChimp status:', error);
    return NextResponse.json(
      { 
        success: false, 
        configured: false,
        error: error instanceof Error ? error.message : 'Failed to check MailChimp status' 
      },
      { status: 500 }
    );
  }
}
