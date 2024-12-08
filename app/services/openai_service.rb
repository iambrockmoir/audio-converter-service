class OpenAiService
  def self.transcribe(mp3_data)
    # Create a temporary file for the MP3 data
    temp_file = Tempfile.new(['audio', '.mp3'])
    begin
      temp_file.binwrite(mp3_data)
      temp_file.rewind
      
      # Initialize OpenAI client
      client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
      
      # Send to Whisper API
      response = client.audio.transcribe(
        model: "whisper-1",
        file: File.open(temp_file.path, 'rb'),
        response_format: "text"
      )
      
      # Return the transcription text
      response
    ensure
      temp_file.close
      temp_file.unlink
    end
  rescue => e
    Rails.logger.error "Transcription failed: #{e.message}"
    raise
  end
end 