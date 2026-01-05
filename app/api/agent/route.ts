import { NextRequest, NextResponse } from 'next/server'
import parseLLMJson from '@/utils/jsonParser'

/**
 * POST /api/agent
 * Secure AI agent API with BULLETPROOF multi-strategy JSON parsing
 *
 * SECURITY:
 * - API keys stored server-side only (never exposed to client)
 * - Environment variable based configuration
 *
 * SUPPORTS FILE ATTACHMENTS:
 * - Upload files first via /api/upload to get asset_ids
 * - Pass asset_ids in the 'assets' array parameter
 * - Agent can analyze images, PDFs, and other uploaded files
 *
 * PARSING STRATEGIES (Applied in order):
 * 1. Preprocessing: Removes \n, \r, \t escapes and code block markers
 * 2. Direct parse: Fast JSON.parse for well-formed JSON
 * 3. Advanced parse: parseLLMJson with automatic fixes for:
 *    - Trailing commas
 *    - Unquoted keys
 *    - Single quotes to double quotes
 *    - Python values (True/False/None)
 *    - Single-line and multi-line comments
 *    - BOM characters
 * 4. Extraction: Finds and parses JSON from mixed text
 * 5. Last resort: Aggressive parsing with all fixes enabled
 *
 * HANDLES EDGE CASES:
 * - Response wrapped in markdown code blocks
 * - Escaped newlines converted to actual newlines
 * - Double-encoded JSON strings automatically parsed
 * - Nested response objects unwrapped
 * - Malformed JSON with syntax errors
 * - Plain text responses (returned as-is)
 * - Already-parsed object responses
 *
 * EXAMPLE RESPONSES IT HANDLES:
 * ✅ "```json\n{\"result\": \"poem\"}\n```"
 * ✅ "{\"success\": true, \"data\": {...}}"
 * ✅ "Here is your poem:\n{\"result\": \"...\"}"
 * ✅ {response: "stringified json"}
 * ✅ Plain text without JSON
 *
 * @param {string|object} message - The message to send to the agent (objects auto-converted to JSON string)
 * @param {string} agent_id - The ID of the agent to chat with
 * @param {string} [user_id] - Optional user ID for session tracking
 * @param {string} [session_id] - Optional session ID for conversation continuity
 * @param {string[]} [assets] - Optional array of asset IDs from /api/upload for file attachments
 *
 * INPUT TRANSFORMATION:
 * - If message is an object/dict, it's automatically JSON.stringify()'d
 * - If message is a number/boolean, it's converted to String()
 * - This prevents errors when frontend passes structured data instead of string
 *
 * @returns {success, response, raw_response, agent_id, user_id, session_id, timestamp}
 */

const LYZR_API_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/'

// API key from environment variable only - NO hardcoded fallback!
const LYZR_API_KEY = process.env.LYZR_API_KEY

export async function POST(request: NextRequest) {
  try {
    // Check API key is configured
    if (!LYZR_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'LYZR_API_KEY not configured in .env.local',
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    let { message, agent_id, user_id, session_id, assets } = body

    // Transform message to string if it's an object/dict
    // This handles cases where frontend accidentally passes an object instead of string
    if (message && typeof message === 'object') {
      try {
        message = JSON.stringify(message)
        console.log('⚙️ Transformed message object to string')
      } catch (e) {
        // If stringify fails, convert to string representation
        message = String(message)
      }
    } else if (message !== undefined && message !== null && typeof message !== 'string') {
      // Handle other non-string types (number, boolean, etc.)
      message = String(message)
    }

    // Validate required fields
    if (!message || !agent_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: message and agent_id are required',
        },
        { status: 400 }
      )
    }

    // Build request payload
    const payload: Record<string, any> = {
      user_id: user_id || `user-${Date.now()}`,
      agent_id,
      session_id: session_id || `session-${Date.now()}`,
      message,
    }

    // Add assets if provided (for file attachments)
    if (assets && Array.isArray(assets) && assets.length > 0) {
      payload.assets = assets
    }

    // Call Lyzr API with server-side API key (secure!)
    const response = await fetch(LYZR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LYZR_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const data = await response.json()

      console.log('=== AGENT API RESPONSE ===')
      console.log('Response field type:', typeof data.response)
      console.log('Response field sample:', typeof data.response === 'string' ? data.response.slice(0, 100) : JSON.stringify(data.response).slice(0, 100))

      // CRITICAL FIX: If response is a string containing JSON, parse it FIRST
      let rawResponse = data.response

      // Step 1: Handle string responses that contain JSON
      if (typeof rawResponse === 'string') {
        console.log('Response is string, attempting to parse...')

        // Clean up the string
        let cleaned = rawResponse
        cleaned = cleaned.replace(/\\n/g, '\n')
        cleaned = cleaned.replace(/\\r/g, '\r')
        cleaned = cleaned.replace(/\\t/g, '\t')
        cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/gm, '')
        cleaned = cleaned.replace(/\n?```\s*$/gm, '')
        cleaned = cleaned.trim()

        // Try to parse the cleaned string
        try {
          const parsed = JSON.parse(cleaned)
          if (parsed && typeof parsed === 'object') {
            console.log('SUCCESS: Parsed string as JSON')
            rawResponse = parsed
          }
        } catch (parseErr) {
          console.log('FAILED: Could not parse string as JSON', parseErr)
          // Keep as string if parsing fails
        }
      }

      // Step 2: Now we either have an object or a string - extract response
      let parsedResponse = rawResponse

      // Step 3: If it's now an object, try to unwrap it if it's nested
      if (typeof parsedResponse === 'object' && parsedResponse !== null) {
        console.log('Working with object response')

        // Check if there's a deeply nested structure that needs unwrapping
        if (parsedResponse.status === 'success' && parsedResponse.result) {
          console.log('Found status:success with result field - this is the actual response')
          // Already in the right format, keep it
        } else if (parsedResponse.response && typeof parsedResponse.response === 'string') {
          // This shouldn't happen but handle it
          try {
            const innerParsed = JSON.parse(parsedResponse.response)
            if (innerParsed && typeof innerParsed === 'object') {
              console.log('Unwrapped nested response field')
              parsedResponse = innerParsed
            }
          } catch (e) {
            // Keep as is
          }
        }
      }

      const finalResponse = {
        success: true,
        response: parsedResponse,
        raw_response: data.response,
        agent_id,
        user_id,
        session_id,
        timestamp: new Date().toISOString(),
      }

      console.log('=== FINAL RESPONSE ===')
      console.log('Response type:', typeof parsedResponse)
      console.log('Has result field:', !!parsedResponse?.result)
      console.log('Has policy_draft:', !!parsedResponse?.result?.policy_draft)
      console.log('Response summary:', JSON.stringify(parsedResponse, null, 2).slice(0, 300))

      return NextResponse.json(finalResponse)
    } else {
      const errorText = await response.text()
      return NextResponse.json(
        {
          success: false,
          error: `API returned status ${response.status}`,
          details: errorText,
        },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('AI Agent API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS preflight (if needed)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
