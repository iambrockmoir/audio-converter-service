class AudioController < ApplicationController
    def process
      logger.info "Processing audio request..."
      
      # Log the request details
      logger.info "Received request: media_url=#{params[:media_url]}, from_number=#{params[:from_number]}"
      
      begin
        # Queue the processing job
        AudioProcessingJob.perform_later(
          media_url: params[:media_url],
          from_number: params[:from_number],
          callback_url: params[:callback_url]
        )
        
        # Return accepted response
        render json: { status: 'processing' }, status: :accepted
      rescue => e
        logger.error "Failed to queue job: #{e.message}"
        logger.error e.backtrace.join("\n")
        render json: { error: e.message }, status: :internal_server_error
      end
    end
  end