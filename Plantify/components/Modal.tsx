import React, { ReactNode } from "react";
import { View, Modal, TouchableWithoutFeedback, ModalProps, StyleSheet } from "react-native";

interface CustomModalProps {
    visible: boolean;
    transparent?: boolean;
    dismiss: () => void;
    animationType?: ModalProps["animationType"];
    children: ReactNode;
}

export default function CustomModal(props: Readonly<CustomModalProps>) {
    return (
        <Modal
            visible={props.visible}
            transparent={props.transparent}
            onRequestClose={props.dismiss}
            animationType={props.animationType}>
            <TouchableWithoutFeedback onPress={props.dismiss}>
                <View style={styles.modalOverlay} />
            </TouchableWithoutFeedback>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    {props.children}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        paddingBottom: 100,
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonOpen: {
        backgroundColor: '#F194FF',
    },
    buttonClose: {
        backgroundColor: '#2196F3',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
});