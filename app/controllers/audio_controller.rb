class AudioController < ApplicationController
    def process
      logger.info "Processing audio request..."
      
      # Log the request details
      logger.info "Received request: from_number=#{params[:from_number]}"
      
      begin
        # Save base64 audio to temp file
        temp_file = Tempfile.new(['audio', '.mp3'])
        temp_file.binmode
        temp_file.write(Base64.decode64(params[:audio]))
        temp_file.rewind
        
        # Read the MP3 data
        mp3_data = temp_file.read
        
        # Transcribe with OpenAI
        logger.info "Starting OpenAI transcription"
        transcription = OpenAiService.transcribe(mp3_data)
        logger.info "Transcription completed: #{transcription}"
        
        # Send result back to Vercel
        logger.info "Sending transcription to callback URL: #{params[:callback_url]}"
        response = HTTParty.post(
          params[:callback_url],
          body: {
            from_number: params[:from_number],
            transcription: transcription
          }.to_json,
          headers: { 'Content-Type': 'application/json' }
        )
        logger.info "Callback response: #{response.code} - #{response.body}"
        
        render json: { status: 'success', transcription: transcription }
      rescue => e
        logger.error "Failed to process audio: #{e.message}"
        logger.error e.backtrace.join("\n")
        
        # Notify Vercel of failure
        HTTParty.post(
          params[:callback_url],
          body: {
            from_number: params[:from_number],
            error: e.message
          }.to_json,
          headers: { 'Content-Type': 'application/json' }
        )
        
        render json: { error: e.message }, status: :internal_server_error
      ensure
        temp_file&.close
        temp_file&.unlink
      end
    end
end