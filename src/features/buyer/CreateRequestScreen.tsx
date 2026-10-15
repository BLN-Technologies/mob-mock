import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { User } from '../../domain/models';

interface CreateRequestScreenProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateRequestScreen: React.FC<CreateRequestScreenProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [cropName, setCropName] = useState('Maize');
  const [variety, setVariety] = useState('Nyirakaragaza');
  const [minGrade, setMinGrade] = useState('Grade A');
  const [quantityKg, setQuantityKg] = useState('20000');
  const [targetPriceRwf, setTargetPriceRwf] = useState('410');
  const [deliveryDistrict, setDeliveryDistrict] = useState('Kigali (Gasabo)');
  const [deliverySector, setDeliverySector] = useState('Gisozi');
  const [requiredDate, setRequiredDate] = useState('2026-10-30');
  const [notes, setNotes] = useState('Institutional delivery to central school kitchen facility.');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate submission
    setLoading(false);
    Alert.alert(
      'Sourcing Request Posted',
      'Your request for 20,000 kg Maize has been submitted to Cargo operations. Cargo will coordinate verified supply and pool offers for you (FR-REQ-02, FR-REQ-03).',
      [{ text: 'OK', onPress: onSuccess }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>{t.buyer.postRequest}</Text>
      <Text style={styles.subtitle}>Specify produce requirements for Cargo operations to pool from verified cooperatives.</Text>

      <FormField
        label={t.supplier.cropType}
        value={cropName}
        onChangeText={setCropName}
        placeholder="e.g. Maize, Dry Beans"
      />

      <FormField
        label={t.supplier.variety}
        value={variety}
        onChangeText={setVariety}
        placeholder="e.g. Nyirakaragaza"
      />

      <FormField
        label="Minimum Acceptable Grade"
        value={minGrade}
        onChangeText={setMinGrade}
        placeholder="Grade A, Grade B"
      />

      <FormField
        label="Required Quantity (kg)"
        value={quantityKg}
        onChangeText={setQuantityKg}
        keyboardType="numeric"
        placeholder="20000"
        helper="Minimum institutional bulk order is 1,000 kg"
      />

      <FormField
        label="Target Price (RWF / kg)"
        value={targetPriceRwf}
        onChangeText={setTargetPriceRwf}
        keyboardType="numeric"
        placeholder="410"
      />

      <FormField
        label="Delivery District"
        value={deliveryDistrict}
        onChangeText={setDeliveryDistrict}
        placeholder="e.g. Kigali (Gasabo)"
      />

      <FormField
        label="Delivery Sector"
        value={deliverySector}
        onChangeText={setDeliverySector}
        placeholder="e.g. Gisozi"
      />

      <FormField
        label="Required Delivery Date"
        value={requiredDate}
        onChangeText={setRequiredDate}
        placeholder="YYYY-MM-DD"
      />

      <FormField
        label="Procurement Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={2}
      />

      <View style={styles.buttonRow}>
        <Button
          title={t.common.cancel}
          onPress={onCancel}
          variant="secondary"
          style={styles.btnHalf}
        />
        <Button
          title="Submit Request"
          onPress={handleSubmit}
          loading={loading}
          style={styles.btnHalf}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutralDark,
  },
  subtitle: {
    fontSize: 13,
    color: colors.neutralGray,
    marginTop: 4,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  btnHalf: {
    flex: 1,
  },
});
