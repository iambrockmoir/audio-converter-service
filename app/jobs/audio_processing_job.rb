class AudioProcessingJob < ApplicationJob
  queue_as :default
  
  def perform(media_url:, from_number:, callback_url:)
    # Download and convert audio
    mp3_data = AudioConverter.convert(media_url)
    
    # Transcribe with OpenAI
    transcription = OpenAiService.transcribe(mp3_data)
    
    # Send result back to Vercel
    HTTParty.post(
      callback_url,
      body: {
        from_number: from_number,
        transcription: transcription
      }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )
  rescue => e
    # Notify Vercel of failure
    HTTParty.post(
      callback_url,
      body: {
        from_number: from_number,
        error: e.message
      }.to_json,
      headers: { 'Content-Type' => 'application/json' }
    )
  end
end 