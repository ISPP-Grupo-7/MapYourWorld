import React, { useState } from 'react';
import { TextInput as RNTextInput, View, Text, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import Icon from 'react-native-vector-icons/Feather';

const StyledTextInput = styled(RNTextInput);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: string;
  className?: string;
}

const TextInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  icon,
  className = '',
}: TextInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);

  return (
    <StyledView className="mb-4 w-full">
      {label ? <StyledText className="text-gray-700 mb-1 font-medium">{label}</StyledText> : null}
      
      <StyledView className={`flex-row items-center border rounded-md px-3 py-2 ${error ? 'border-red-500' : 'border-gray-300'} bg-white ${className}`}>
        {icon ? (
          <Icon name={icon} size={20} color="#9CA3AF" style={{ marginRight: 10 }} />
        ) : null}
        
        <StyledTextInput
          className="flex-1 text-gray-800"
          placeholder={placeholder || ''}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor="#9CA3AF"
        />
        
        {secureTextEntry ? (
          <StyledTouchableOpacity onPress={togglePasswordVisibility} className="ml-2">
            <Icon name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} color={isPasswordVisible ? "#2bbbad" : "#9CA3AF"} />
          </StyledTouchableOpacity>
        ) : null}
      </StyledView>
      
      {error ? <StyledText className="text-red-500 text-sm mt-1">{error}</StyledText> : null}
    </StyledView>
  );
};

export default TextInput; 