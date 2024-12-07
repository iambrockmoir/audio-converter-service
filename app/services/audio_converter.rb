class AudioConverter
  def convert(input_file)
    logger.info "Starting conversion..."
    
    # Create temporary files
    input_path = Rails.root.join('tmp', "input_#{SecureRandom.hex(8)}")
    output_path = Rails.root.join('tmp', "output_#{SecureRandom.hex(8)}.mp3")
    
    begin
      # Write uploaded file to disk
      File.binwrite(input_path, input_file.read)
      logger.info "Wrote input file to #{input_path}"
      
      # Run FFmpeg
      command = "ffmpeg -f amr -i #{input_path} -y -acodec libmp3lame -ac 1 -b:a 128k #{output_path}"
      logger.info "Running command: #{command}"
      
      output = `#{command} 2>&1`
      logger.info "FFmpeg output: #{output}"
      
      if $?.success?
        # Read converted file
        mp3_data = File.binread(output_path)
        logger.info "Successfully read #{mp3_data.length} bytes of MP3 data"
        mp3_data
      else
        raise "FFmpeg conversion failed: #{output}"
      end
    ensure
      # Clean up temp files
      File.unlink(input_path) if File.exist?(input_path)
      File.unlink(output_path) if File.exist?(output_path)
    end
  end
end 