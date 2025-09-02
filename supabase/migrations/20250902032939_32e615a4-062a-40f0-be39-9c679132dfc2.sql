-- Create storage buckets for hotel images and documents
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('hotel-images', 'hotel-images', true),
  ('booking-documents', 'booking-documents', false),
  ('user-avatars', 'user-avatars', true);

-- Storage policies for hotel images (public bucket)
CREATE POLICY "Anyone can view hotel images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'hotel-images');

CREATE POLICY "Admins can upload hotel images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'hotel-images' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can update hotel images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'hotel-images' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can delete hotel images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'hotel-images' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Storage policies for booking documents (private bucket)
CREATE POLICY "Users can view their own booking documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'booking-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own booking documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'booking-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all booking documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'booking-documents' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Storage policies for user avatars (public bucket)
CREATE POLICY "Anyone can view user avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'user-avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);