class AudioController < ApplicationController
  def process
    # Get parameters from Vercel
    media_url = params[:media_url]
    from_number = params[:from_number]
    callback_url = params[:callback_url]
    
    # Enqueue processing with built-in Active Job
    AudioProcessingJob.perform_later(
      media_url: media_url,
      from_number: from_number,
      callback_url: callback_url
    )
    
    # Immediately return success
    render json: { status: "processing" }, status: :ok
  end
end 