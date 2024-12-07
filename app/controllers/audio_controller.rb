class AudioController < ApplicationController
    def process
      logger.info "Processing audio request..."
      
      # Log the uploaded file
      logger.info "Received file: #{params[:audio].inspect}"
      
      # Get the uploaded file
      audio_file = params[:audio]
      
      begin
        # Convert the audio
        converter = AudioConverter.new
        mp3_data = converter.convert(audio_file)
        logger.info "Conversion successful, mp3 size: #{mp3_data.length} bytes"
        
        # Return the converted data
        send_data mp3_data, 
                  filename: "converted.mp3",
                  type: "audio/mpeg",
                  disposition: "attachment"
      rescue => e
        logger.error "Conversion failed: #{e.message}"
        logger.error e.backtrace.join("\n")
        render json: { error: e.message }, status: :internal_server_error
      end
    end
  end