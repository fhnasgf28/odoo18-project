odoo.define('equip1_node8_automation.camera_capture', function(require) {
    'use strict';

    const core = require('web.core');
    const registry = require('web.field_registry');
    const AbstractField = require('web.AbstractField');
    const Dialog = require('web.Dialog');
    const _t = core._t;

    /**
     * Custom Image Field with Camera Button
     * Extends the standard image widget to add camera capture functionality
     */
    const ImageWithCameraField = AbstractField.extend({
        template: 'equip1_node8_automation.ImageWithCameraField',
        supportedFieldTypes: ['binary'],
        events: _.extend({}, AbstractField.prototype.events, {
            'click .camera-button': '_onCameraButtonClick',
        }),
        
        /**
         * Initialize variables
         */
        init: function() {
            this._super.apply(this, arguments);
            this.mediaStream = null;
            this.videoElement = null;
            this.canvasElement = null;
            this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },

        /**
         * @override
         */
        _render: function() {
            this._super.apply(this, arguments);
            
            // If we're on a mobile device, check if we have camera support
            if (this.isMobile) {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    console.warn('Camera API not supported on this device');
                    this.$('.camera-button').prop('disabled', true)
                        .attr('title', _t('Camera not supported on this device'));
                }
            }
        },
        
        /**
         * Handle camera button click - open camera modal
         * 
         * @private
         * @param {MouseEvent} ev 
         */
        _onCameraButtonClick: function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            
            const self = this;
            
            // Create camera modal from template
            this.cameraDialog = new Dialog(this, {
                title: _t('Capture Document'),
                size: 'large',
                renderFooter: false,
                $content: $(core.qweb.render('equip1_node8_automation.CameraModal')),
                technical: false,
            });
            
            // Show dialog
            this.cameraDialog.opened().then(() => {
                // Set up event listeners for camera controls
                self.cameraDialog.$el.find('.capture-btn').on('click', self._onCaptureImage.bind(self));
                self.cameraDialog.$el.find('.retake-btn').on('click', self._onRetakeImage.bind(self));
                self.cameraDialog.$el.find('.use-image-btn').on('click', self._onUseImage.bind(self));
                self.cameraDialog.$el.find('.close-camera-btn, .close').on('click', self._onCloseCamera.bind(self));
                
                // Start camera
                self._startCamera();
            });
            
            this.cameraDialog.open();
        },
        
        /**
         * Start camera stream
         * 
         * @private
         */
        _startCamera: function() {
            const self = this;
            
            // Get video element
            this.videoElement = this.cameraDialog.$el.find('#camera-preview')[0];
            this.canvasElement = this.cameraDialog.$el.find('#camera-canvas')[0];
            
            // Configure constraints based on device
            const constraints = {
                video: {
                    facingMode: this.isMobile ? 'environment' : 'user', // Use back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };
            
            // Request camera access
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(stream) {
                    // Store stream for later cleanup
                    self.mediaStream = stream;
                    
                    // Display video stream
                    self.videoElement.srcObject = stream;
                    self.videoElement.play();
                    
                    // On iOS, we need to handle orientation changes
                    if (self.isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                        window.addEventListener('orientationchange', function() {
                            // Give time for the orientation to change
                            setTimeout(function() {
                                // Reset video dimensions
                                const track = stream.getVideoTracks()[0];
                                const settings = track.getSettings();
                                self.videoElement.width = settings.width;
                                self.videoElement.height = settings.height;
                            }, 500);
                        });
                    }
                })
                .catch(function(error) {
                    self._displayCameraError(error);
                });
        },
        
        /**
         * Handle capture button click
         * 
         * @private
         */
        _onCaptureImage: function() {
            // Make sure video and canvas elements exist
            if (!this.videoElement || !this.canvasElement) {
                return;
            }
            
            try {
                // Set canvas dimensions to match video
                const video = this.videoElement;
                const canvas = this.canvasElement;
                
                // Get the actual video dimensions
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;
                
                // Set canvas size to match video
                canvas.width = videoWidth;
                canvas.height = videoHeight;
                
                // Draw video frame to canvas
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Show canvas, hide video
                $(canvas).removeClass('d-none');
                $(video).addClass('d-none');
                
                // Update buttons
                this.cameraDialog.$el.find('.capture-btn').addClass('d-none');
                this.cameraDialog.$el.find('.retake-btn, .use-image-btn').removeClass('d-none');
            } catch (error) {
                console.error('Error capturing image:', error);
                this._displayCameraError(error);
            }
        },
        
        /**
         * Handle retake button click
         * 
         * @private
         */
        _onRetakeImage: function() {
            // Show video, hide canvas
            this.cameraDialog.$el.find('#camera-preview').removeClass('d-none');
            this.cameraDialog.$el.find('#camera-canvas').addClass('d-none');
            
            // Update buttons
            this.cameraDialog.$el.find('.capture-btn').removeClass('d-none');
            this.cameraDialog.$el.find('.retake-btn, .use-image-btn').addClass('d-none');
        },
        
        /**
         * Handle use image button click - save captured image
         * 
         * @private
         */
        _onUseImage: function() {
            try {
                // Get image data from canvas
                const imageData = this.canvasElement.toDataURL('image/jpeg', 0.9);
                const base64Data = imageData.split(',')[1];
                
                // Set field value
                this._setValue(base64Data);
                
                // Show success notification
                this.displayNotification({
                    type: 'success',
                    title: _t('Success'),
                    message: _t('Image captured successfully'),
                    sticky: false,
                });
                
                // Close dialog
                this._onCloseCamera();
            } catch (error) {
                console.error('Error saving image:', error);
                this._displayCameraError(error);
            }
        },
        
        /**
         * Handle close button click - cleanup camera
         * 
         * @private
         */
        _onCloseCamera: function() {
            // Stop media stream
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
                this.mediaStream = null;
            }
            
            // Close dialog
            if (this.cameraDialog) {
                this.cameraDialog.close();
                this.cameraDialog = null;
            }
        },
        
        /**
         * Display camera error notifications
         * 
         * @private
         * @param {Error} error 
         */
        _displayCameraError: function(error) {
            console.error('Camera error:', error);
            
            let errorMessage = _t('Failed to access camera.');
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = _t('Camera access was denied. Please allow camera access in your browser settings.');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = _t('No camera found on this device.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = _t('Camera is already in use by another application.');
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = _t('Camera does not meet the required constraints.');
            }
            
            this.displayNotification({
                type: 'danger',
                title: _t('Camera Error'),
                message: errorMessage,
                sticky: false,
            });
            
            // Close dialog
            this._onCloseCamera();
        },
        
        /**
         * Clean up when widget is destroyed
         * 
         * @override
         */
        destroy: function() {
            this._onCloseCamera();
            this._super.apply(this, arguments);
        }
    });

    // Register the custom field widget
    registry.add('image_camera', ImageWithCameraField);

    return ImageWithCameraField;
});